import { filter } from 'lodash';
import { Icon } from '@iconify/react';
import { sentenceCase } from 'change-case';
import { useState, useEffect } from 'react';
import plusFill from '@iconify/icons-eva/plus-fill';
import { Link as RouterLink } from 'react-router-dom';
import moment from 'moment';
// material
import {
  Card,
  Table,
  Stack,
  Button,
  TableRow,
  TableBody,
  TableCell,
  Container,
  Typography,
  TableContainer,
  TablePagination
} from '@material-ui/core';
import firebase from '../firebase';
// components
import Page from '../components/Page';
import Label from '../components/Label';
import Scrollbar from '../components/Scrollbar';
import SearchNotFound from '../components/SearchNotFound';
import { UserListHead, UserListToolbar, UserMoreMenu } from '../components/_dashboard/user';
import { clientDataGet, clientDataSet, coorDataSet } from '../utils/cache';
import ModalComponents from '../components/ModalComponents';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'name', label: 'Full Name', alignRight: false },
  { id: 'ndisNumber', label: 'NDIS Number', alignRight: false },
  { id: 'email', label: 'Email', alignRight: false },
  { id: 'phone', label: 'Contact Number', alignRight: false },
  { id: 'dobNumber', label: 'Date Of Birth', alignRight: false },
  { id: 'clientSpec', label: 'Client Spec', alignRight: false },
  { id: 'coordinator', label: 'Coordinator', alignRight: false },
  { id: 'fundsQuarantine', label: 'Funds Quarantine', alignRight: false },
  { id: 'address', label: 'Address', alignRight: false },
  { id: 'planManagementDetail', label: 'Plan Management Detail', alignRight: false },
  { id: 'status', label: 'Status', alignRight: false },
  { id: '' }
];

// ----------------------------------------------------------------------

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function applySortFilter(array, comparator, query) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  if (query) {
    return filter(
      array,
      (_client) => _client.name.toLowerCase().indexOf(query.toLowerCase()) !== -1
    );
  }
  return stabilizedThis.map((el) => el[0]);
}

export default function Client() {
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState('asc');
  const [clients, setClients] = useState([]);
  const [coor, setCoor] = useState([]);
  const [orderBy, setOrderBy] = useState('name');
  const [filterName, setFilterName] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [openModal, setOpenModal] = useState(false);
  const [uid, setUid] = useState('');

  useEffect(() => {
    firebase
      .firestore()
      .collection('clients')
      .onSnapshot((snapshot) => {
        const newClient = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setClients(newClient);
      });
    firebase
      .firestore()
      .collection('refferedby')
      .onSnapshot((snapshot) => {
        const newRef = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setCoor(newRef);
      });
  }, []);

  if (clients) {
    clientDataSet(clients);
  }

  if (coor) {
    coorDataSet(coor);
  }

  const deleteClientEach = (id) => {
    setUid(id);
    setOpenModal(true);
  };

  const handleModalClose = () => {
    setOpenModal(false);
  };

  const deleteClient = () => {
    const client = clientDataGet();
    const fileteredDeleteClient = client.filter((client) => client.id === uid)[0];
    firebase.firestore().collection('clients').doc(fileteredDeleteClient.id).set({
      name: fileteredDeleteClient?.name,
      email: fileteredDeleteClient?.email,
      phone: fileteredDeleteClient?.phone,
      clientSpec: fileteredDeleteClient?.clientSpec,
      coordinator: fileteredDeleteClient?.coordinator,
      fundsQuarantine: fileteredDeleteClient?.fundsQuarantine,
      address: fileteredDeleteClient?.address,
      ndisNumber: fileteredDeleteClient?.ndisNumber,
      dobNumber: fileteredDeleteClient?.dobNumber,
      planManagementDetail: fileteredDeleteClient?.planManagementDetail,
      status: 'non-active'
    });
    setOpenModal(false);
  };

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterByName = (event) => {
    setFilterName(event.target.value);
  };

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - clients?.length) : 0;

  const filteredClients = applySortFilter(clients, getComparator(order, orderBy), filterName);

  const fillteredActiveClient = filteredClients.filter((client) => client.status === 'active');

  const isUserNotFound = filteredClients.length === 0;

  return (
    <Page title="Client | Minimal-UI">
      <Container maxWidth={false}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4" gutterBottom>
            Client
          </Typography>
          <Button
            variant="contained"
            component={RouterLink}
            to="/dashboard/client-manage?act=Add"
            startIcon={<Icon icon={plusFill} />}
          >
            New Client
          </Button>
        </Stack>

        <Card>
          <UserListToolbar filterName={filterName} onFilterName={handleFilterByName} />

          <Scrollbar>
            <TableContainer sx={{ minWidth: 800, width: 1500 }}>
              <Table>
                <UserListHead
                  order={order}
                  orderBy={orderBy}
                  headLabel={TABLE_HEAD}
                  rowCount={clients.length}
                  onRequestSort={handleRequestSort}
                />
                <TableBody>
                  {fillteredActiveClient
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row) => {
                      const {
                        id,
                        name,
                        email,
                        phone,
                        clientSpec,
                        coordinator,
                        fundsQuarantine,
                        address,
                        ndisNumber,
                        dobNumber,
                        planManagementDetail,
                        status
                      } = row;
                      return (
                        <TableRow hover key={id} tabIndex={-1}>
                          <TableCell padding="checkbox" />
                          <TableCell component="th" scope="row" padding="none">
                            <RouterLink
                              to={`/dashboard/client-manage?act=Edit&id=${id}`}
                              style={{ textDecoration: 'none', color: '#000' }}
                            >
                              <Stack direction="row" alignItems="center" spacing={2}>
                                <Typography variant="subtitle2" noWrap>
                                  {name}
                                </Typography>
                              </Stack>
                            </RouterLink>
                          </TableCell>
                          <TableCell align="left">{ndisNumber}</TableCell>
                          <TableCell align="left">{email}</TableCell>
                          <TableCell align="left">{phone}</TableCell>
                          <TableCell align="left" width={130}>
                            {moment(dobNumber).format('DD-MM-YYYY')}
                          </TableCell>
                          <TableCell align="left" width={120}>
                            {clientSpec}
                          </TableCell>
                          <TableCell align="left" width={100}>
                            {coordinator}
                          </TableCell>
                          <TableCell align="left" width={100}>
                            $ {fundsQuarantine}
                          </TableCell>
                          <TableCell align="left">{address}</TableCell>
                          <TableCell align="left">
                            {planManagementDetail === 1 && 'Plan Management'}
                            {planManagementDetail === 0 && 'Ndis Management'}
                          </TableCell>
                          <TableCell align="left">
                            <Label
                              variant="ghost"
                              color={(status === 'banned' && 'error') || 'success'}
                            >
                              {sentenceCase(status)}
                            </Label>
                          </TableCell>

                          <TableCell align="right">
                            <UserMoreMenu
                              deleteFunction={() => deleteClientEach(id)}
                              linkEdit={`/dashboard/client-manage?act=Edit&id=${id}`}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  {emptyRows > 0 && (
                    <TableRow style={{ height: 53 * emptyRows }}>
                      <TableCell colSpan={6} />
                    </TableRow>
                  )}
                </TableBody>
                {isUserNotFound && (
                  <TableBody>
                    <TableRow>
                      <TableCell align="center" colSpan={6} sx={{ py: 3 }}>
                        <SearchNotFound searchQuery={filterName} />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                )}
              </Table>
            </TableContainer>
            <ModalComponents
              title="Delete"
              message="Are you sure you wish to delete this customer?"
              open={openModal}
              handleSubmit={deleteClient}
              handleClose={handleModalClose}
            />
          </Scrollbar>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={clients.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Card>
      </Container>
    </Page>
  );
}
